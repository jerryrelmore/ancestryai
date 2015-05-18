
import re

reline = re.compile("^ *([0-9]+) +((@[^\s]*@) +)?([^\s]+)( +(.*))?$")

class SpecialHandling:
    def __init__(self):
        self.redate = re.compile(
                "^(?P<beforeafter>BEF\. |AFT\. |ABT\. )?"
                "(?P<full>"
                    "(?P<yearA>[1-9][0-9]*)"
                    "|"
                    "(?P<dayB>[1-9][0-9]?) (?P<monthB>[A-Z]+) (?P<yearB>[1-9][0-9]*)"
                    "|"
                    "BET\. (?P<yearC1>[1-9][0-9]*) - (?P<yearC2>[1-9][0-9]*)"
                ")$")
    def check(self, entry):
        if hasattr(self, entry.tag):
            func = getattr(self, entry.tag)
            func(entry)
    def DATE(self, entry):
        match = self.redate.match(entry.value)
        if match:
            modifier = match.groupdict()["beforeafter"]
            if modifier:
                modifier = modifier.strip(". ")
            if match.groupdict()["yearA"]:
                year = int(match.groupdict()["yearA"])
            elif match.groupdict()["yearB"]:
                year = int(match.groupdict()["yearB"])
            elif match.groupdict()["yearC1"]:
                year = (int(match.groupdict()["yearC1"]) + int(match.groupdict()["yearC2"])) / 2
                if not modifier:
                    modifier = match.groupdict()["full"]
            else:
                year = None
            entry.additional["year"] = year
            entry.additional["year_modifier"] = modifier
        else:
            print "no match: " + entry.value
specials = SpecialHandling()

class Entry:
    def __init__(self, level, xref, tag, value):
        self.level = level
        self.xref = xref
        self.tag = tag
        self.value = value

        self.children = {}
        self.parent = None

        self.additional = {}
        specials.check(self)

    def add_child(self, child):
        if child.tag not in self.children:
            self.children[child.tag] = []
        self.children[child.tag].append(child)
        child.parent = self

    def traverse(self):
        buf = [self]
        while buf:
            cur = buf.pop()
            yield cur
            for tag, lst in sorted(cur.children.items(), reverse=True):
                for entry in lst:
                    buf.append(entry)

    def as_dict(self):
        children = []
        for tag, lst in self.children.items():
            for entry in lst:
                children.append(entry.as_dict())
        obj = {
            "level": self.level,
            "xref": self.xref,
            "tag": self.tag,
            "value": self.value,
            "children": children,
        }
        obj.update(self.additional)
        return obj

    def by_tag(self, tag):
        return self.children.get(tag, [])
    def by_xref(self, xref):
        for tag, lst in self.children.items():
            for entry in lst:
                if entry.xref == xref:
                    return entry
        return None
    def first_tag(self, tag):
        lst = self.by_tag(tag)
        return lst[0] if lst else None

def read_file(filename):
    f = open(filename)
    lines = f.readlines()
    f.close()
    tagstack = [Entry(-1, None, "ROOT", None)]
    for i_, line in enumerate(lines):
        i = i_ + 1
        match = reline.match(line)
        if match:
            level, _, xref, tag, _, value = match.groups()
            level = int(level)
            if level < 0:
                raise Exception("invalid level on line {}".format(i))
            entry = Entry(level, xref, tag, value)
            while tagstack and entry.level <= tagstack[-1].level:
                tagstack.pop()
            if entry.level != tagstack[-1].level + 1:
                raise Exception("expected level {}, got {} on line {}".format(tagstack[-1].level+1, entry.level, i))
            tagstack[-1].add_child(entry)
            tagstack.append(entry)
        else:
            print "no match"
    return tagstack[0]

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print "python {} <gedcom-file>".format(sys.argv[0])
        sys.exit()
    root = read_file(sys.argv[1])
    for entry in root.traverse():
        print "{}{:2}     {:8}     {:6}     '{}'".format(
                "  "*entry.level,
                entry.level,
                entry.xref or "--",
                entry.tag or "--",
                entry.value or "--",
                )
